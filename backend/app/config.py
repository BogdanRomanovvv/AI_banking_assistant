from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    yandex_api_key: str
    yandex_folder_id: str
    yandex_model: str = "yandexgpt"
    
    # Yandex Mail settings
    yandex_mail_login: str = ""
    yandex_mail_password: str = ""
    yandex_mail_imap_server: str = "imap.yandex.ru"
    yandex_mail_imap_port: int = 993
    yandex_mail_check_interval: int = 60  # секунды

    # SMTP для исходящих писем
    yandex_mail_smtp_server: str = "smtp.yandex.ru"
    yandex_mail_smtp_port: int = 465  # SSL
    yandex_mail_smtp_use_ssl: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()
