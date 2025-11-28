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
    
    class Config:
        env_file = ".env"


settings = Settings()
