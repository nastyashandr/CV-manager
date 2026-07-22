import Card from 'react-bootstrap/Card';

export default function StatCard({ label, value }) {
  return (
    <Card className="text-center h-100">
      <Card.Body>
        <Card.Title as="div" className="display-6">{value}</Card.Title>
        <Card.Text className="text-muted">{label}</Card.Text>
      </Card.Body>
    </Card>
  );
}