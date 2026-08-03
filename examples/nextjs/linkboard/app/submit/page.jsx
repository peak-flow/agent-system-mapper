import SubmitForm from '../../components/SubmitForm'

export const metadata = {
  title: 'Submit a link — LinkBoard',
}

// Server component shell; the interactive form is a client component.
export default function SubmitPage() {
  return (
    <section>
      <h2>Submit a link</h2>
      <SubmitForm />
    </section>
  )
}
