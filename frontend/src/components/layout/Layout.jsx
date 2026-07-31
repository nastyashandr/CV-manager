import Container from "react-bootstrap/Container";
import Header from "./Header.jsx";
import { Outlet } from "react-router-dom";
import HelpButton from "../common/HelpButton.jsx";
import { SupportTicketProvider } from "../../contexts/SupportTicketContext.jsx";

export default function Layout() {
  return (
    <SupportTicketProvider>
      <Header />
      <Container className="py-4">
        <Outlet />
      </Container>
      <HelpButton />
    </SupportTicketProvider>
  );
}