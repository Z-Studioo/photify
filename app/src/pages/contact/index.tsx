import { ContactPage } from '@/components/pages/contact';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function Contact() {
  return (
  <>
  <Helmet>
    <title>Contact Us | Photify</title>
    <meta
      name="description"
      content="Get in touch with the Photify team for support, inquiries, or feedback. We're here to help you with all your photo product needs."
    />
    <meta name="robots" content="index,follow" />
  </Helmet>
  <ContactPage />
  </>
);
}
