import * as React from "react";

interface EmailTemplateProps {
  email: string;
  ip: string | null;
  device: string | null;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ email, ip, device }) => (
  <div>
    <p>
      A new user has logged in from {email} at {new Date().toLocaleString()}.
    </p>

    {device && <p>Device Info: {device}</p>}

    {ip && <p>IP Address: {ip}</p>}
  </div>
);
