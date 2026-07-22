import Container from "react-bootstrap/Container";
import Header from "./Header.jsx";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <Header />
      <Container className="py-4">
        <Outlet />
      </Container>
    </>
  );
}