import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { IoHomeSharp } from "react-icons/io5";
import "./page.css";
import "../globals.css";

export default function ForbiddenPage() {
  return (
    <div className="container">
      <img src="./gandalf.png" alt="" />
      <div className="text">
        <h1>You Shall not pass</h1>
        <p>
          Nie masz dostępu do tej strony. Skontaktuj się z
          <span> administratorem</span>, jeśli uważasz, że to błąd.
        </p>
        <div className="buttons">
          <a
            className="button"
            href="/"
            aria-label="back to home"
            title="back to home"
          >
            back to home
          </a>

          <a className="button" href="/login" aria-label="login" title="login">
            login
          </a>
        </div>
      </div>
    </div>
  );
}
