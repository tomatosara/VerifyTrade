import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Link } from "react-router-dom";

export default function Carousel() {
  const slides = [
    {
      bgImage: "/image/shake-hand.png",
      bgImageMobile: "/image/shake-hand.png",
      buttonText: "立即登入",
      buttonLink: "/login",
      buttonColor: "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white",
    },
    {
      bgImage: "/image/trust-bg-desktop.jpg",
      bgImageMobile: "/image/trust-bg-mobile.jpg",
      buttonText: "建立表單",
      buttonLink: "/newform",
      buttonColor: "bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)] text-white",
    },
    {
      bgImage: "/images/security-bg-desktop.jpg",
      bgImageMobile: "/images/security-bg-mobile.jpg",
      buttonText: "查詢交易序號",
      buttonLink: "/openform",
      buttonColor: "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white",
    },
  ];

  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 8000 }}
      loop
      className="relative h-[75vh] md:h-[65vh] w-full"
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i}>
          {/* 背景圖片 */}
          <picture className="absolute inset-0 -z-10">
            <source media="(max-width: 640px)" srcSet={slide.bgImageMobile} />
            <img
              src={slide.bgImage}
              alt={`slide-${i}`}
              className="w-full h-full object-cover object-center"
            />
          </picture>

          {/* 按鈕 */}
          <div
            className="
              absolute
              flex
              w-full
              justify-center       /* 手機置中 */
              bottom-[13%]         /* 手機：按鈕更靠下 */
              md:justify-end       /* 桌機靠右 */
              md:bottom-[20%]      /* 桌機往上 */
              md:right-[15%]       /* 桌機右邊留白 */
            "
          >
            <Link to={slide.buttonLink}>
              <InteractiveHoverButton
                className={`${slide.buttonColor} w-40 md:w-48 py-3 rounded-full font-semibold text-white border-none`}
              >
                {slide.buttonText}
              </InteractiveHoverButton>
            </Link>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
