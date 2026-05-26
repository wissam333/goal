const VOTER_ID_KEY = 'voter_id'

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const useVoterId = () => {
  const getVoterId = () => {
    if (!import.meta.client) return null
    let id = localStorage.getItem(VOTER_ID_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(VOTER_ID_KEY, id)
    }
    return id
  }

  return { getVoterId }
}
