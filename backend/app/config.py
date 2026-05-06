from pydantic_settings import BaseSettings
from typing import List
import secrets


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    FOUNDER_PASSWORD: str
    SECRET_KEY: str = secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Practical EduSkills URLs
    PES_NAME: str = "Practical EduSkills"
    PES_WEBSITE: str = "https://www.practicaleduskills.com/"
    PES_INSTAGRAM: str = "https://www.instagram.com/practical_eduskills/"
    PES_YOUTUBE: str = "https://www.youtube.com/@practicaleduskills2338"
    PES_LINKEDIN: str = "https://www.linkedin.com/company/practical-eduskills-pvt-ltd/"
    PES_FACEBOOK: str = "https://www.facebook.com/PracticalEduSkills/"
    PES_ADS_PAGE_ID: str = "1918954478374979"

    # Nilaya Education URLs
    NILAYA_NAME: str = "Nilaya Education"
    NILAYA_WEBSITE: str = "https://nilayaeducation.org/"
    NILAYA_INSTAGRAM: str = "https://www.instagram.com/nilayaeducationpune/"
    NILAYA_YOUTUBE: str = "https://www.youtube.com/@nilayaeducationpune"
    NILAYA_LINKEDIN: str = "https://www.linkedin.com/company/nilaya-education-group/"
    NILAYA_FACEBOOK: str = "https://www.facebook.com/nilayaeducationgroup"
    NILAYA_ADS_PAGE_ID: str = "673182602853634"

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
    ]

    CLAUDE_MODEL: str = "claude-opus-4-5-20251101"
    CLAUDE_MAX_TOKENS: int = 8096
    SESSION_TTL_SECONDS: int = 3600 * 8  # 8-hour sessions

    class model_config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


def get_competitor_config(brand: str) -> dict:
    if brand.lower() in ("pes", "practical_eduskills", "practical eduskills"):
        return {
            "name": settings.PES_NAME,
            "website": settings.PES_WEBSITE,
            "instagram": settings.PES_INSTAGRAM,
            "youtube": settings.PES_YOUTUBE,
            "linkedin": settings.PES_LINKEDIN,
            "facebook": settings.PES_FACEBOOK,
            "ads_page_id": settings.PES_ADS_PAGE_ID,
        }
    return {
        "name": settings.NILAYA_NAME,
        "website": settings.NILAYA_WEBSITE,
        "instagram": settings.NILAYA_INSTAGRAM,
        "youtube": settings.NILAYA_YOUTUBE,
        "linkedin": settings.NILAYA_LINKEDIN,
        "facebook": settings.NILAYA_FACEBOOK,
        "ads_page_id": settings.NILAYA_ADS_PAGE_ID,
    }
