import {
  Body,
  Column,
  Container,
  Font,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

const FONT_SANS = "'Geist', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const FONT_DISPLAY =
  "'Bricolage Grotesque', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif";

const COLORS = {
  sky1: '#bee3ff',
  sky3: '#4fa3f2',
  sky4: '#1e73cc',
  ink: '#0b1b33',
  muted: '#6e809b',
  line: '#e5eaf2',
  paper: '#f7f9fc',
  white: '#ffffff',
};

const STRIPE_CELL_SIZE = 14;
const STRIPE_COLS = 40;

const FLAG_DATA_URI = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 4" width="40" height="32"><rect fill="#0b1b33" x="0" y="0" width="1" height="1"/><rect fill="#fff" x="1" y="0" width="1" height="1"/><rect fill="#0b1b33" x="2" y="0" width="1" height="1"/><rect fill="#fff" x="3" y="0" width="1" height="1"/><rect fill="#0b1b33" x="4" y="0" width="1" height="1"/><rect fill="#fff" x="0" y="1" width="1" height="1"/><rect fill="#0b1b33" x="1" y="1" width="1" height="1"/><rect fill="#fff" x="2" y="1" width="1" height="1"/><rect fill="#0b1b33" x="3" y="1" width="1" height="1"/><rect fill="#fff" x="4" y="1" width="1" height="1"/><rect fill="#0b1b33" x="0" y="2" width="1" height="1"/><rect fill="#fff" x="1" y="2" width="1" height="1"/><rect fill="#0b1b33" x="2" y="2" width="1" height="1"/><rect fill="#fff" x="3" y="2" width="1" height="1"/><rect fill="#0b1b33" x="4" y="2" width="1" height="1"/><rect fill="#fff" x="0" y="3" width="1" height="1"/><rect fill="#0b1b33" x="1" y="3" width="1" height="1"/><rect fill="#fff" x="2" y="3" width="1" height="1"/><rect fill="#0b1b33" x="3" y="3" width="1" height="1"/><rect fill="#fff" x="4" y="3" width="1" height="1"/></svg>')}`;

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export default function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Geist"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Bricolage Grotesque"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: COLORS.paper,
          fontFamily: FONT_SANS,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <Container style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, #a9d6ff 0%, #6bb1f0 55%, #3e8bd8 100%)',
              borderRadius: '0 0 12px 12px',
              padding: '36px 24px 40px',
              textAlign: 'center',
            }}
          >
            <table
              cellPadding={0}
              cellSpacing={0}
              style={{ margin: '0 auto', position: 'relative', zIndex: 1 }}
            >
              <tr>
                <td style={{ verticalAlign: 'middle', paddingRight: '10px' }}>
                  <Img
                    src={FLAG_DATA_URI}
                    alt=""
                    width="28"
                    height="22"
                    style={{
                      borderRadius: '5px',
                      boxShadow:
                        '0 4px 14px rgba(11,27,51,0.25), inset 0 0 0 1px rgba(255,255,255,0.4)',
                    }}
                  />
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: FONT_DISPLAY,
                      fontSize: '22px',
                      fontWeight: 800,
                      color: COLORS.white,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Lakitu
                  </Text>
                </td>
              </tr>
            </table>
          </div>

          <Section style={{ textAlign: 'center', padding: '32px 24px 0' }}>{children}</Section>

          <Section style={{ paddingTop: '32px' }}>
            <Row>
              {Array.from({ length: STRIPE_COLS }, (_, i) => (
                <Column
                  key={i}
                  style={{
                    width: `${STRIPE_CELL_SIZE}px`,
                    height: `${STRIPE_CELL_SIZE}px`,
                    backgroundColor: i % 2 === 0 ? '#5A9CE4' : '#2A76C3',
                  }}
                />
              ))}
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export { COLORS, FONT_DISPLAY, FONT_SANS };
