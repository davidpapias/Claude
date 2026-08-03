import { Body, Caption, Card, Heading, Screen } from '@/components/ui';

const FAQ = [
  ['¿Esto es una app de citas?', 'No. Círculo está hecha para amistad. No hay lenguaje romántico ni funciones pensadas para ligar.'],
  ['¿Quién puede escribirme?', 'Solo alguien con quien tengas un match, es decir, cuando ambos mostraron interés.'],
  ['¿Se ve mi ubicación?', 'No. Solo tu zona aproximada y una distancia estimada.'],
  ['¿Qué pasa si reporto a alguien?', 'Un moderador revisa el caso. En casos graves ocultamos el perfil mientras tanto.'],
  ['¿Puedo borrar mi cuenta?', 'Sí, desde Ajustes. Tu perfil deja de ser visible y se anonimiza.'],
];

export default function Help() {
  return (
    <Screen>
      <Heading>Ayuda</Heading>
      {FAQ.map(([question, answer]) => (
        <Card key={question}>
          <Caption>{question}</Caption>
          <Body muted>{answer}</Body>
        </Card>
      ))}
      <Body muted>¿Necesitas algo más? Escríbenos a hola@circulo.app</Body>
    </Screen>
  );
}
