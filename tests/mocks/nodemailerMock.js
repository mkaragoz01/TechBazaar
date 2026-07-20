// Tests shouldn't make real network calls to Gmail's SMTP server (slow,
// flaky, and pointless — we're not testing nodemailer or Gmail here).
module.exports = {
    createTransport: () => ({
        sendMail: () => Promise.resolve({}),
    }),
};
