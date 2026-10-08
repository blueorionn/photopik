import { Spinner } from '../Spinner'

export default function ConfirmClient() {
  // TODO: exchange the `code` query param for a session with the Flask API,
  // then redirect to `next` (or '/'). On failure redirect to /auth/error
  // with an appropriate ?reason=.
  return (
    <div className='flex flex-col items-center text-center'>
      <Spinner className='text-muted size-10' />
      <p className='text-muted mt-4 text-sm'>Verifying your magic link…</p>
    </div>
  )
}
