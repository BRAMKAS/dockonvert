from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_secret_key: str = "change-me"
    cors_origins: str = "http://localhost:3009"
    frontend_url: str = "http://localhost:3009"

    # Miniflare local proxy
    miniflare_url: str = ""
    d1_base_url: str = ""
    r2_base_url: str = ""

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "dockonvert-files"
    r2_endpoint: str = ""

    # Cloudflare D1
    cf_api_token: str = ""
    cf_account_id: str = ""
    d1_database_id: str = ""

    # Email (Resend)
    resend_api_key: str = ""
    email_from: str = "DocKonvert <noreply@dockonvert.com>"

    # Limits
    rate_limit_per_hour: int = 100
    max_file_size_mb: int = 10

    @property
    def is_local(self) -> bool:
        return self.app_env == "development" and bool(self.miniflare_url)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
