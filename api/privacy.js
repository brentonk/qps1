module.exports = async (_req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Privacy Policy — GPT-2300</title>
    </head>
    <body style="font-family: sans-serif; max-width: 640px; margin: auto; padding: 2em;">
      <h1>Privacy Policy for GPT-2300</h1>
      <p>This tool supports students in PSCI 2300 (Quantitative Political Science I: Computing) at Vanderbilt University. It enables GPT-2300 to access course content hosted at <a href="https://bkenkel.com/qps1">https://bkenkel.com/qps1</a>.</p>
      <p>No personal data is collected, stored, or shared. All tool responses are based solely on public course material. No user-specific information is logged, and all requests are transient and used only for answering course-related questions.</p>
      <p>For questions or concerns, contact the course instructor, Brenton Kenkel.</p>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
};

