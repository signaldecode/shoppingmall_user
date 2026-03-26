/**
 * 적립금 관리 API composable
 * GET /users/me - 사용자 정보에서 적립금 잔액 조회 (PointInfo: { currentPoint, totalEarned, totalUsed })
 *
 * 참고: 별도의 /users/points/history 엔드포인트 없음
 * 적립금 내역은 백엔드에 해당 API가 추가될 때까지 빈 배열 반환
 */

export const usePoints = () => {
  const { get } = useApi();

  const balance = ref(0);
  const totalEarned = ref(0);
  const totalUsed = ref(0);
  const history = ref([]);
  const pending = ref(false);
  const error = ref(null);

  /**
   * 적립금 잔액 조회
   * UserMeResponse.point = { currentPoint: int, totalEarned: int, totalUsed: int }
   */
  const fetchBalance = async () => {
    pending.value = true
    error.value = null

    try {
      const response = await get('/users/me')
      const data = response.data || response
      const pointInfo = data?.point || {}

      balance.value = pointInfo.currentPoint ?? 0
      totalEarned.value = pointInfo.totalEarned ?? 0
      totalUsed.value = pointInfo.totalUsed ?? 0

      return balance.value
    } catch (e) {
      console.error('Failed to fetch points balance:', e)
      balance.value = 0
      return balance.value
    } finally {
      pending.value = false
    }
  }

  /**
   * 적립금 내역 조회
   * 현재 백엔드에 별도 history 엔드포인트 없음 → 빈 배열 반환
   */
  const fetchHistory = async () => {
    pending.value = true
    error.value = null

    try {
      // 백엔드에 /users/points/history 엔드포인트가 추가되면 여기서 호출
      // const response = await get('/users/points/history', queryParams)
      // history.value = response.data?.content || []
      history.value = []
      return history.value
    } catch (e) {
      console.error('Failed to fetch points history:', e)
      history.value = []
      return history.value
    } finally {
      pending.value = false
    }
  }

  /**
   * 날짜 포맷
   */
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  /**
   * 적립금 내역 변환
   */
  const transformHistory = (item) => ({
    id: item.id,
    date: formatDate(item.createdAt || item.date),
    description: item.description || item.reason || "-",
    amount: item.amount || 0,
    amountText: `${item.amount > 0 ? "+" : ""}${Number(item.amount).toLocaleString()}P`,
    status: item.status || item.type || "EARNED",
    isPositive: item.amount > 0,
  });

  /**
   * 변환된 적립금 내역
   */
  const transformedHistory = computed(() => {
    return history.value.map(transformHistory);
  });

  return {
    // 상태
    balance,
    totalEarned,
    totalUsed,
    history,
    transformedHistory,
    pending,
    error,
    // 메서드
    fetchBalance,
    fetchHistory,
    transformHistory,
  };
};
