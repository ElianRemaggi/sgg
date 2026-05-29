import { act, renderHook } from '@testing-library/react-native'
import { useGymStore } from '@/store/gymStore'

beforeEach(() => {
  useGymStore.setState({ selectedGymId: null })
})

describe('gymStore', () => {
  it('initial state has selectedGymId as null', () => {
    const { result } = renderHook(() => useGymStore())
    expect(result.current.selectedGymId).toBeNull()
  })

  it('setGym updates selectedGymId', () => {
    const { result } = renderHook(() => useGymStore())
    act(() => {
      result.current.setGym('42')
    })
    expect(result.current.selectedGymId).toBe('42')
  })

  it('clearGym resets selectedGymId to null', () => {
    useGymStore.setState({ selectedGymId: '42' })
    const { result } = renderHook(() => useGymStore())
    act(() => {
      result.current.clearGym()
    })
    expect(result.current.selectedGymId).toBeNull()
  })

  it('setGym can be called multiple times and retains last value', () => {
    const { result } = renderHook(() => useGymStore())
    act(() => {
      result.current.setGym('1')
      result.current.setGym('99')
    })
    expect(result.current.selectedGymId).toBe('99')
  })
})
