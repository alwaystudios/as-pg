export const withRunningState = (): [() => boolean, (r: boolean) => void] => {
  // eslint-disable-next-line functional/no-let
  let isRunning = false
  const setRunning = (r: boolean) => (isRunning = r)
  return [() => isRunning, setRunning]
}
