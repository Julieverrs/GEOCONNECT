from django.contrib.auth.tokens import PasswordResetTokenGenerator

class EmployerTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        login_timestamp = '' if user.last_login is None else user.last_login.replace(microsecond=0, tzinfo=None)
        return (
            str(user.pk) + str(timestamp) + str(login_timestamp) +
            str(user.email) + str(user.is_active)
        )

# Create an instance of the custom token generator
employer_password_reset_token = EmployerTokenGenerator()

    