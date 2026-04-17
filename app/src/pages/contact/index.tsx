import { ContactPage } from '@/components/pages/contact';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function Contact() {
  const title = 'Contact Us | Photify';
  const description =
    "Get in touch with the Photify team for support, inquiries, or feedback. We're here to help you with all your photo product needs.";

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta name='robots' content='index,follow' />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta name='twitter:card' content='summary' />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
      </Helmet>
      <ContactPage />
    </>
  );
}
