/**
 * 카테고리 API composable
 * GET /categories - 카테고리 트리 조회
 */
export const useCategory = () => {
  const { get } = useApi()

  const categories = ref([])
  const pending = ref(false)
  const error = ref(null)

  /**
   * 카테고리 트리 조회
   * GET /categories
   */
  const fetchCategories = async () => {
    pending.value = true
    error.value = null

    try {
      const response = await get('/categories')
      categories.value = response.data || response || []
      return categories.value
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      error.value = err.data?.message || err.message
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * ID로 카테고리 찾기 (트리 탐색)
   * @param {number} categoryId
   */
  const findCategory = (categoryId) => {
    const search = (items) => {
      for (const item of items) {
        if (item.id === categoryId) return item
        if (item.children?.length) {
          const found = search(item.children)
          if (found) return found
        }
      }
      return null
    }
    return search(categories.value)
  }

  /**
   * 루트 카테고리만 반환
   */
  const rootCategories = computed(() => {
    return categories.value.filter(c => !c.parentId)
  })

  return {
    categories,
    rootCategories,
    pending,
    error,
    fetchCategories,
    findCategory
  }
}
