const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: `MedCare <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    console.log(`Attempting to send email to: ${options.email} via ${process.env.EMAIL_HOST}`);
    await transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (email, otp, type = 'verification') => {
    const isReset = type === 'reset';
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1f2f1; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0D9488; margin: 0;">MedCare</h1>
                <p style="color: #64748b; font-size: 14px;">Your Trusted Healthcare Partner</p>
            </div>
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
                <h2 style="color: #1e293b; margin-top: 0;">${isReset ? 'Password Reset' : 'Verification'} Code</h2>
                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                    ${isReset ? 'Use the following code to reset your password.' : 'Please use the following code to verify your account.'} 
                    This code is valid for 10 minutes.
                </p>
                <div style="background-color: #0D9488; color: white; font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; border-radius: 6px; display: inline-block;">
                    ${otp}
                </div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
                If you didn't request this code, please ignore this email.
            </p>
        </div>
    `;

    await sendEmail({
        email,
        subject: isReset ? 'Reset Your MedCare Password' : 'Verify Your MedCare Account',
        html,
    });
};

module.exports = { sendEmail, sendOTPEmail };
