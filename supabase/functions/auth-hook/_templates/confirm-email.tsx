import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
  Hr,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface ConfirmEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  userName?: string
}

export const ConfirmEmail = ({
  token_hash,
  supabase_url,
  email_action_type,
  redirect_to,
  userName,
}: ConfirmEmailProps) => {
  const confirmLink = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`
  
  return (
    <Html>
      <Head />
      <Preview>Confirmez votre inscription sur BenchmarkAI</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logo}>⚡ BenchmarkAI</Text>
          </Section>
          
          <Heading style={h1}>Bienvenue sur BenchmarkAI ! 🎉</Heading>
          
          <Text style={text}>
            Bonjour{userName ? ` ${userName}` : ''} 👋
          </Text>
          
          <Text style={text}>
            Merci de vous être inscrit sur BenchmarkAI ! Pour activer votre compte et commencer à créer vos benchmarks, cliquez sur le bouton ci-dessous :
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={confirmLink}>
              Confirmer mon inscription ✅
            </Button>
          </Section>
          
          <Section style={benefitsBox}>
            <Text style={benefitsTitle}>Ce qui vous attend :</Text>
            <Text style={benefitItem}>📊 Analyse complète de votre marché</Text>
            <Text style={benefitItem}>🎯 Positionnement stratégique sur-mesure</Text>
            <Text style={benefitItem}>💰 Recommandations tarifaires basées sur vos concurrents</Text>
            <Text style={benefitItem}>📈 Plan d'action 30/60/90 jours</Text>
          </Section>
          
          <Text style={smallText}>
            Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.
          </Text>
          
          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              BenchmarkAI - Votre outil de benchmark intelligent
            </Text>
            <Text style={footerSubText}>
              Contact: benchmarkaiapp@outlook.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ConfirmEmail

const main = {
  backgroundColor: '#f8f7f4',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 20px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#1a1a1a',
  borderRadius: '30px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const benefitsBox = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
}

const benefitsTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px',
}

const benefitItem = {
  color: '#4a4a4a',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
}

const smallText = {
  color: '#888888',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#e5e5e5',
  margin: '32px 0',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  color: '#888888',
  fontSize: '14px',
  margin: '0 0 4px',
}

const footerSubText = {
  color: '#aaaaaa',
  fontSize: '12px',
  margin: '0',
}
