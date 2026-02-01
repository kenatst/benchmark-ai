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

interface MagicLinkEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  userName?: string
  isRecovery?: boolean
}

export const MagicLinkEmail = ({
  token_hash,
  supabase_url,
  email_action_type,
  redirect_to,
  userName,
  isRecovery,
}: MagicLinkEmailProps) => {
  const confirmLink = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`
  
  return (
    <Html>
      <Head />
      <Preview>
        {isRecovery 
          ? 'Réinitialisez votre mot de passe BenchmarkAI'
          : 'Connectez-vous à BenchmarkAI en un clic'
        }
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logo}>⚡ BenchmarkAI</Text>
          </Section>
          
          <Heading style={h1}>
            {isRecovery ? 'Réinitialisez votre mot de passe' : 'Votre lien de connexion'}
          </Heading>
          
          <Text style={text}>
            Bonjour{userName ? ` ${userName}` : ''} 👋
          </Text>
          
          <Text style={text}>
            {isRecovery 
              ? 'Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :'
              : 'Cliquez sur le bouton ci-dessous pour vous connecter à BenchmarkAI :'
            }
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={confirmLink}>
              {isRecovery ? 'Réinitialiser mon mot de passe' : 'Me connecter →'}
            </Button>
          </Section>
          
          <Text style={smallText}>
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé {isRecovery ? 'de réinitialisation' : 'de connexion'}, ignorez cet email.
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

export default MagicLinkEmail

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
