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

const sendApprovalEmail = async (email, name, role) => {
    const loginUrl = `${process.env.CLIENT_URL}/login`;
    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1f2f1; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0D9488; margin: 0;">MedCare</h1>
                <p style="color: #64748b; font-size: 14px;">Application Approved</p>
            </div>
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
                <h2 style="color: #10b981; margin-top: 0;">Congratulations, ${name}!</h2>
                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                    Your application to join MedCare as a <strong>${roleName}</strong> has been reviewed and approved by our administrative team.
                </p>
                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                    You can now log in to your dashboard and begin using the platform.
                </p>
                <a href="${loginUrl}" style="background-color: #0D9488; color: white; text-decoration: none; font-weight: bold; padding: 15px 30px; border-radius: 6px; display: inline-block;">
                    Log In Now
                </a>
            </div>
        </div>
    `;

    await sendEmail({
        email,
        subject: 'Application Approved - Welcome to MedCare',
        html,
    });
};

const sendRejectionEmail = async (email, name, reason) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ef4444; margin: 0;">MedCare</h1>
                <p style="color: #64748b; font-size: 14px;">Application Status Update</p>
            </div>
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px;">
                <h2 style="color: #ef4444; margin-top: 0; text-align: center;">Application Rejected</h2>
                <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">
                    Dear ${name},<br><br>
                    We regret to inform you that your application to join MedCare has been rejected by our administrative team.
                </p>
                <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 25px;">
                    <h3 style="color: #991b1b; margin-top: 0; font-size: 14px;">Reason for Rejection:</h3>
                    <p style="color: #991b1b; margin: 0; font-style: italic;">"${reason}"</p>
                </div>
                <p style="color: #475569; font-size: 14px;">
                    Your account data has been removed from our system. If you believe this was an error or you have corrected the issues mentioned above, you are welcome to submit a new application.
                </p>
            </div>
        </div>
    `;

    await sendEmail({
        email,
        subject: 'Update on your MedCare Application',
        html,
    });
};

const sendDoctorCredentialsEmail = async (email, name, tempPassword) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1f2f1; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0D9488; margin: 0;">MedCare</h1>
                <p style="color: #64748b; font-size: 14px;">Your Trusted Healthcare Partner</p>
            </div>
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px;">
                <h2 style="color: #1e293b; margin-top: 0;">Welcome, Dr. ${name}!</h2>
                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                    Your profile has been created on the MedCare platform by your hospital. You can now login using the temporary credentials below:
                </p>
                <div style="background-color: #e2e8f0; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 18px; color: #0D9488;">${tempPassword}</span></p>
                </div>
                <p style="color: #475569; font-size: 14px; margin-bottom: 0;">
                    <em>Note: For security reasons, you will be required to change your password upon your first login.</em>
                </p>
            </div>
        </div>
    `;

    await sendEmail({
        email,
        subject: 'Your MedCare Doctor Account Credentials',
        html,
    });
};

module.exports = { 
    sendEmail, 
    sendOTPEmail, 
    sendDoctorCredentialsEmail,
    sendApprovalEmail,
    sendRejectionEmail 
};
