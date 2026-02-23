import { useState } from "react";
import { Button } from "../../../components/common/Button";
import { InputField } from "../../../components/common/InputField";
import { Loader } from "../../../components/common/Loader";
import { GoogleAuthButton } from "./GoogleAuthButton";

export function AuthForm({ type = "login", onSubmit, onGoogleAuth, isSubmitting, error }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const isSignup = type === "signup";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isSignup ? (
        <InputField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter your name"
          required
        />
      ) : null}

      <InputField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="example@email.com"
        required
      />

      <InputField
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Minimum 8 characters"
        required
      />

      {error ? <p className="error-text">{error}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader /> : isSignup ? "Create Account" : "Login"}
      </Button>

      {onGoogleAuth ? (
        <GoogleAuthButton isSubmitting={isSubmitting} onCredential={onGoogleAuth} />
      ) : null}
    </form>
  );
}
