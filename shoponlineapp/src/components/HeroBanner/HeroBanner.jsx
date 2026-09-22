
import {ArrowRight,Sparkles,Compass,Gem} from 'lucide-react'
import { motion } from 'motion/react'
import styles from './HeroBanner.module.css'

export default function HeroBanner ({
  onShopNow,
  onExploreCollection
})  {
  return (
    <section
      id="home-hero-banner"
      className={styles.heroBanner}
    >
      <div
        className={`${styles.heroDecoration} ${styles.heroDecorationRight}`}
      />

      <div
        className={`${styles.heroDecoration} ${styles.heroDecorationLeft}`}
      />

      <div className={styles.heroContent}>

        <div className={styles.heroInfo}>

          <div className={styles.collectionBadge}>
            <Sparkles className={styles.sparkleIcon} />

            <span>
              Fuwuys Atelier - Bộ sưu tập mới năm 2026
            </span>
          </div>

          <h1
            id="hero-headline"
            className={styles.heroTitle}
          >
            Khám phá{' '}
            <span>phong cách hoàn hảo</span>{' '}
            của bạn
          </h1>

          <p
            id="hero-subtitle"
            className={styles.heroSubtitle}
          >
            Tìm những món đồ thời trang bạn sẽ yêu thích
            với gợi ý cá nhân hoá, chất liệu thủ công tinh xảo
            và thẩm mỹ tối giản vượt thời gian.
          </p>

          <div className={styles.heroActions}>

            <button
              type="button"
              id="hero-shop-now-btn"
              onClick={onShopNow}
              className={styles.shopButton}
            >
              <span>Mua ngay</span>

              <ArrowRight className={styles.arrowIcon} />
            </button>

            <button
              type="button"
              id="hero-explore-btn"
              onClick={onExploreCollection}
              className={styles.exploreButton}
            >
              <Compass className={styles.compassIcon} />

              <span>
                Khám phá bộ sưu tập
              </span>
            </button>

          </div>

          <div className={styles.heroStats}>

            <div className={styles.heroStat}>
              <p>100%</p>
              <span>Hàng chính hãng</span>
            </div>

            <div className={styles.heroStat}>
              <p>48h</p>
              <span>Giao hàng nhanh</span>
            </div>

            <div className={styles.heroStat}>
              <p>4.9/5.0</p>
              <span>Đánh giá khách hàng</span>
            </div>

          </div>

        </div>

        <div className={styles.heroVisual}>

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            transition={{
              duration: 0.4,
              ease: 'easeOut'
            }}
            className={styles.heroImageCard}
          >

            <div
              className={`${styles.visualDecoration} ${styles.visualDecorationTop}`}
            />

            <div
              className={`${styles.visualDecoration} ${styles.visualDecorationBottom}`}
            />

            <div className={styles.heroGem}>
              <Gem />
            </div>

            <div className={styles.heroOverlay} />

            <div className={styles.floatingLabel}>

              <div className={styles.labelContent}>
                <span>
                  Bộ sưu tập nổi bật
                </span>

                <strong>
                  Tinh hoa thủ công da thật
                </strong>
              </div>

              <Sparkles className={styles.labelIcon} />

            </div>

          </motion.div>

        </div>

      </div>
    </section>
  )
}


