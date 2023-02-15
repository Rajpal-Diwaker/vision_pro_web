var mailTemplate = {
  from: "Vision R Pro<admin@metatronix.io>",
  subject: "Vision Pro Forgot Password",
  text:
    "Hi,<br><br>You have requested to reset your password. Please click on the following 'Reset Password' link to reset your password.<br><br><a target='_blank' href='{{webURL}}/forgot/{{token}}/{{forgotToken}}'>Reset Password</a><br><br>if above link is not working then copy below url and paste it into browser address bar and hit enter<br><br>{{webURL}}/forgot/{{token}}/{{forgotToken}}<br><br>Thanks,<br>Team METATRONIX / VisionR-Pro"
};

var mailTemplateOrg = {
  from: "Vision R Pro<admin@metatronix.io>",
  subject: "Vision Pro",
  text:
    "Hi,<br><br> UserId : {{email}}<br> Password : {{password}} <br><br>Thanks,<br>Team METATRONIX / VisionR-Pro"
};

var mailTemplateAgent = {
  from: "Vision R Pro<admin@metatronix.io>",
  subject: "Vision Pro",
  text:
    "Dear user,<br>Here is your personal QR code, scan it to connect to the VisionR-Pro app:<br>Thank you.<br> Team METATRONIX / VisionR-Pro<br> <img src='{{uri}}' /> "
};

var contactTemplate = {
  from: "Vision R Pro<admin@metatronix.io>",
  to: "admin@vision.com",
  subject: "Vision Pro Contact",
  text:
    "Hi,<br><br> Name: {{full_name}}<br> Email : {{email}} <br><br> phone : {{phone}} <br><br> phone : {{comment}} <br>Thanks,<br>Team METATRONIX / VisionR-Pro"
}

var mailTemplateNotif = {
  from: "Vision R Pro<admin@metatronix.io>",
  subject: "Vision Pro",
  text:
    "Hi,<br><br> Dear Customer, <br><br><br><br> The METATRONIX’s team is glad to inform you that your company account has been created for the videoconferencing platform, VisionR-Pro. Please click on the following link to generate your password.<br><br><a target='_blank' href='{{webURL}}/forgot/{{token}}/{{forgotToken}}'>Generate Password</a><br><br>if above link is not working then copy below url and paste it into browser address bar and hit enter<br><br>{{webURL}}/forgot/{{token}}/{{forgotToken}}<br><br>We thank you for your confidence.<br>Team METATRONIX / VisionR-Pro"
};

var mailTemplateNotif1 = {
  from: "Vision R Pro<admin@metatronix.io>",
  subject: "Vision Pro",
  text:
    "Hi,<br><br> {{description}}<br>Team METATRONIX / VisionR-Pro"
};

module.exports = {
  mailTemplate: mailTemplate,
  mailTemplateOrg: mailTemplateOrg,
  mailTemplateAgent: mailTemplateAgent,
  contactTemplate: contactTemplate,
  mailTemplateNotif: mailTemplateNotif,
  mailTemplateNotif1: mailTemplateNotif1
};
