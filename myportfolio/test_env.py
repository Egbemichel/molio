import os
from pathlib import Path
from decouple import Config, RepositoryEnv
import smtplib

BASE_DIR = Path(__file__).resolve().parent
env_file = BASE_DIR / '.env'

if env_file.exists():
    config = Config(RepositoryEnv(str(env_file)))
else:
    print('Error: Could not find .env file')
    exit(1)

def test_database():
    settings_module = config('DJANGO_SETTINGS_MODULE', default='')
    if 'dev' in settings_module:
        print('Testing Database connection...')
        print('✅ Local environment detected (config.settings.dev). You are using SQLite automatically.')
        return
    
    try:
        import psycopg2
        print('Testing Database connection...')
        conn = psycopg2.connect(
            dbname=config('DB_NAME', default='molio_portfolio'),
            user=config('DB_USER', default='molio_user'),
            password=config('DB_PASSWORD', default=''),
            host=config('DB_HOST', default='localhost'),
            port=config('DB_PORT', default='5432')
        )
        print('✅ Database connection successful!')
        conn.close()
    except ImportError:
        print('⚠️ psycopg2 is not installed. Testing DB skipped.')
    except Exception as e:
        print(f'❌ Database connection failed: {e}')

def test_email():
    print('Testing Email connection...')
    host = config('EMAIL_HOST', default='smtp.gmail.com')
    port = config('EMAIL_PORT', default=587, cast=int)
    user = config('EMAIL_HOST_USER', default='')
    password = config('EMAIL_HOST_PASSWORD', default='')
    
    if not user or not password or password == 'your-app-password':
        print('❌ Cannot test email: EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is not set correctly in .env')
        return

    try:
        server = smtplib.SMTP(host, port)
        server.starttls()
        server.login(user, password)
        print('✅ Email SMTP connection successful!')
        server.quit()
    except Exception as e:
        print(f'❌ Email connection failed: {e}')

if __name__ == '__main__':
    test_database()
    test_email()
