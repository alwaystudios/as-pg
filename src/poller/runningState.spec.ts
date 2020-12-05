import { withRunningState } from './runningState'

describe('running state', () => {
  it('use running state', () => {
    const [isRunning, setRunning] = withRunningState()
    expect(isRunning()).toBe(false)
    setRunning(true)
    expect(isRunning()).toBe(true)
  })
})
