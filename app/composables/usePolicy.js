/**
 * 약관/정책 API composable
 * GET   /policies/signup         - 회원가입 약관 목록
 * GET   /policies/{id}           - 약관 상세
 * GET   /policies/me/agreements  - 내 약관 동의 현황
 * PATCH /policies/me/agreements  - 약관 동의 변경
 */
export const usePolicy = () => {
  const { get, patch } = useApi()

  const policies = ref([])
  const policy = ref(null)
  const agreements = ref([])
  const pending = ref(false)
  const error = ref(null)

  /**
   * 회원가입 약관 목록 조회
   * GET /policies/signup
   */
  const fetchSignupPolicies = async () => {
    pending.value = true
    error.value = null

    try {
      const response = await get('/policies/signup')
      policies.value = response.data || response || []
      return policies.value
    } catch (err) {
      console.error('Failed to fetch signup policies:', err)
      error.value = err.data?.message || err.message
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 약관 상세 조회
   * GET /policies/{id}
   * @param {number} id
   */
  const fetchPolicy = async (id) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/policies/${id}`)
      policy.value = response.data || response
      return policy.value
    } catch (err) {
      console.error('Failed to fetch policy:', err)
      error.value = err.data?.message || err.message
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 내 약관 동의 현황 조회
   * GET /policies/me/agreements
   */
  const fetchMyAgreements = async () => {
    pending.value = true
    error.value = null

    try {
      const response = await get('/policies/me/agreements')
      agreements.value = response.data || response || []
      return agreements.value
    } catch (err) {
      console.error('Failed to fetch agreements:', err)
      error.value = err.data?.message || err.message
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 약관 동의 변경
   * PATCH /policies/me/agreements
   * @param {Array} updates - [{ policyId, agreed }]
   */
  const updateAgreements = async (updates) => {
    pending.value = true
    error.value = null

    try {
      const response = await patch('/policies/me/agreements', { agreements: updates })
      return { success: true, data: response.data || response }
    } catch (err) {
      console.error('Failed to update agreements:', err)
      const errorMessage = err.data?.message || err.message || '약관 동의 변경에 실패했습니다.'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  return {
    policies,
    policy,
    agreements,
    pending,
    error,
    fetchSignupPolicies,
    fetchPolicy,
    fetchMyAgreements,
    updateAgreements
  }
}
