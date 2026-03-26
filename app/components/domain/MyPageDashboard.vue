<script setup>
import mypageData from '~/data/mypage.json'

const dashboardData = mypageData.pages.dashboard
const authStore = useAuthStore()
const { getOrders, transformOrderList, pending: ordersPending } = useOrder()

const emit = defineEmits(['go-orders', 'select-order'])

// 유저 정보 (null 체크 포함)

const userName = computed(() => authStore.user?.name || dashboardData.profile.defaultName)
const userGrade = computed(() => authStore.user?.grade?.name || dashboardData.profile.defaultGrade)
const userJoinDate = computed(() => {
  if (!authStore.user?.createdAt) return '-'
  const date = new Date(authStore.user.createdAt)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
})

// 통계 정보
const stats = computed(() => [
  { id: 'grade', label: dashboardData.stats.grade.label, value: userGrade.value || dashboardData.stats.grade.defaultValue },
  { id: 'coupon', label: dashboardData.stats.coupon.label, value: authStore.user?.couponCount != null ? `${authStore.user.couponCount}${dashboardData.stats.coupon.unit}` : dashboardData.stats.coupon.defaultValue },
  { id: 'point', label: dashboardData.stats.point.label, value: authStore.user?.point?.currentPoint != null ? `${authStore.user.point.currentPoint.toLocaleString()}${dashboardData.stats.point.unit}` : dashboardData.stats.point.defaultValue }
])

const orderSteps = computed(() => {
  const counts = authStore.user?.orderStatusCount || {}
  return [
    { id: 'pending', label: dashboardData.orderStatus.steps.paid, value: counts.pending || 0 },
    { id: 'preparing', label: dashboardData.orderStatus.steps.ready, value: counts.preparing || 0 },
    { id: 'shipping', label: dashboardData.orderStatus.steps.shipping, value: counts.shipping || 0 },
    { id: 'delivered', label: dashboardData.orderStatus.steps.done, value: counts.delivered || 0 }
  ]
})

const orderSide = computed(() => {
  const counts = authStore.user?.claimCount || {}
  return [
    { id: 'cancel', label: dashboardData.orderStatus.side.cancel, value: counts.cancelCount || 0 },
    { id: 'exchange', label: dashboardData.orderStatus.side.exchange, value: counts.exchangeCount || 0 },
    { id: 'refund', label: dashboardData.orderStatus.side.refund, value: counts.returnCount || 0 }
  ]
})

// 최근 주문 내역 (주문 API 사용)
const recentOrders = ref([])

const fetchRecentOrders = async () => {
  try {
    const response = await getOrders({
      page: 0,
      size: 5,
      sort: 'createdAt,DESC'
    })
    const content = response?.content || []
    recentOrders.value = content.map(transformOrderList)
  } catch (e) {
    console.warn('Failed to fetch recent orders:', e)
    recentOrders.value = []
  }
}

onMounted(() => {
  fetchRecentOrders()
})

const handleSelectOrder = (order) => {
  emit('select-order', order)
}
</script>

<template>
  <section class="mypage-dashboard" :aria-label="dashboardData.ariaLabel">
    <div class="mypage-dashboard__top">
      <div class="mypage-dashboard__profile">
        <div class="mypage-dashboard__profile-left">
          <div class="mypage-dashboard__avatar" aria-hidden="true">
            <IconUser size="2xl" decorative />
          </div>
          <div class="mypage-dashboard__greet">
            <div>
              <p class="mypage-dashboard__greet-title">{{ dashboardData.profile.greetingPrefix }}{{ userName }}{{ dashboardData.profile.greetingSuffix }}</p>
              <p class="mypage-dashboard__greet-sub">{{ dashboardData.profile.gradePrefix }}{{ userGrade }}{{ dashboardData.profile.gradeSuffix }}</p>
            </div>
            <div class="mypage-dashboard__join">
              <span>{{ dashboardData.profile.joinDateLabel }}</span>
              <span class="mypage-dashboard__join-divider" aria-hidden="true" />
              <span class="mypage-dashboard__greet-sub">{{ userJoinDate }}</span>
            </div>
          </div>
        </div>

        <BaseButton :label="dashboardData.profile.editButton" variant="bg" color="black" size="small" to="/mypage/profile" />
      </div>

      <!-- <div class="mypage-dashboard__stats">
        <article v-for="s in stats" :key="s.id" class="mypage-dashboard__stat">
          <p class="mypage-dashboard__stat-label">
            {{ s.label }}
          </p>
          <p class="mypage-dashboard__stat-value">{{ s.value }}</p>
        </article>
      </div> -->
    </div>

    <section class="mypage-dashboard__section">
      <h3 class="mypage-dashboard__section-title">
        <span class="mypage-dashboard__section-title-main">{{ dashboardData.orderStatus.title }}</span>
        <span class="mypage-dashboard__section-title-sub">{{ dashboardData.orderStatus.subtitle }}</span>
      </h3>

      <div class="mypage-dashboard__order-status">
        <div class="mypage-dashboard__status-steps">
          <div
            v-for="step in orderSteps"
            :key="step.id"
            class="mypage-dashboard__status-col"
          >
            <div class="mypage-dashboard__status-step">
              {{ step.value }}
            </div>
            <span class="mypage-dashboard__status-label">{{ step.label }}</span>
          </div>
        </div>

        <aside class="mypage-dashboard__status-side" :aria-label="dashboardData.orderStatus.sideAriaLabel">
          <div
            v-for="s in orderSide"
            :key="s.id"
            class="mypage-dashboard__status-side-row"
          >
            <p class="mypage-dashboard__status-side-label">{{ s.label }}</p>
            <p class="mypage-dashboard__status-side-value">{{ s.value }}</p>
          </div>
        </aside>
      </div>
    </section>

    <section class="mypage-dashboard__section">
      <div style="display:flex; align-items:flex-end; justify-content:space-between; width:100%;">
        <h3 class="mypage-dashboard__section-title" style="margin:0;">
          <span class="mypage-dashboard__section-title-main">{{ dashboardData.recentOrders.title }}</span>
          <span class="mypage-dashboard__section-title-sub">{{ dashboardData.recentOrders.subtitle }}</span>
        </h3>
        <button
          type="button"
          class="mypage-dashboard__view-all"
          @click="emit('go-orders')"
        >
          {{ dashboardData.recentOrders.viewAllButton }}
        </button>
      </div>

      <div class="mypage-dashboard__orders">
        <div v-if="ordersPending" class="mypage-dashboard__loading">
          <BaseSpinner />
        </div>
        <BaseEmpty
          v-else-if="recentOrders.length === 0"
          :message="dashboardData.recentOrders.empty"
          icon="list"
        />
        <MyPageOrderRow
          v-for="order in recentOrders"
          v-else
          :key="order.orderNo"
          :order="order.product"
          :order-no="order.orderNo"
          clickable
          @select="handleSelectOrder(order)"
        />
      </div>
    </section>
  </section>
</template>

