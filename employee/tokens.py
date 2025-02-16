from django.contrib.auth.tokens import PasswordResetTokenGenerator

class CustomTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        # Custom hash based on username and timestamp
        login_timestamp = '' if user.last_login is None else user.last_login.replace(microsecond=0, tzinfo=None)
        return (
            str(user.pk) + str(timestamp) + str(login_timestamp) +
            str(user.email) + str(user.is_active)
        )

# Create an instance of the custom token generator
password_reset_token = CustomTokenGenerator()

