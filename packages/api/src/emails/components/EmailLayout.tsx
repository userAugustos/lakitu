import {
  Body,
  Column,
  Container,
  Font,
  Head,
  Html,
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

const CHECKERBOARD_SIZE = 14;
const CHECKER_COLS = 40;

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
        <Container
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            padding: '40px 0 32px',
          }}
        >
          {/* Header */}
          <Section style={{ textAlign: 'center', paddingBottom: '32px' }}>
            <Row style={{ display: 'inline-table' }}>
              <Column style={{ verticalAlign: 'middle', paddingRight: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    background:
                      'repeating-conic-gradient(#0b1b33 0% 25%, #ffffff 0% 50%) 50% / 12px 12px',
                    boxShadow: '0 4px 14px rgba(11,27,51,0.18), inset 0 0 0 1px rgba(0,0,0,0.08)',
                    display: 'inline-block',
                  }}
                />
              </Column>
              <Column style={{ verticalAlign: 'middle' }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: FONT_DISPLAY,
                    fontSize: '20px',
                    fontWeight: 800,
                    color: COLORS.ink,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Lakitu
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Content card */}
          <Section
            style={{
              backgroundColor: COLORS.white,
              borderRadius: '12px',
              border: `1px solid ${COLORS.line}`,
              padding: '40px 36px 36px',
              textAlign: 'center',
            }}
          >
            {children}
          </Section>

          {/* Checkered stripe */}
          <Section style={{ paddingTop: '24px' }}>
            <Row>
              {Array.from({ length: CHECKER_COLS }, (_, i) => (
                <Column
                  key={i}
                  style={{
                    width: `${CHECKERBOARD_SIZE}px`,
                    height: `${CHECKERBOARD_SIZE}px`,
                    backgroundColor:
                      i % 2 === 0 ? 'rgba(11, 27, 51, 0.12)' : 'rgba(255, 255, 255, 0)',
                  }}
                />
              ))}
            </Row>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', paddingTop: '20px' }}>
            <Text
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '18px',
                color: COLORS.muted,
                fontFamily: FONT_SANS,
              }}
            >
              Lakitu &mdash; Agent validation &amp; management
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export { COLORS, FONT_DISPLAY, FONT_SANS };
