"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const footerLinks = {
  services: [
    { name: "Sound Design", href: "#" },
    { name: "Music Production", href: "#" },
    { name: "Mixing & Mastering", href: "#" },
    { name: "Game Audio", href: "#" },
  ],
  company: [
    { name: "About", href: "#about" },
    { name: "Projects", href: "#projects" },
    { name: "Services", href: "#services" },
    { name: "Contact", href: "#contact" },
  ],
};

export function Footer() {
  return (
    <footer className="relative py-16 border-t border-white/5">
      {/* Background waveform */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute bottom-0 left-0 right-0 h-64 opacity-5"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0 100 Q360 50 720 100 T1440 100 V200 H0 Z"
            fill="var(--color-accent)"
            animate={{
              d: [
                "M0 100 Q360 50 720 100 T1440 100 V200 H0 Z",
                "M0 100 Q360 150 720 100 T1440 100 V200 H0 Z",
                "M0 100 Q360 50 720 100 T1440 100 V200 H0 Z",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.div
              className="text-2xl font-bold mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              VanVinkl
            </motion.div>
            <motion.p
              className="text-[var(--color-text-secondary)] max-w-sm mb-6"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Your friendly sound wizard. Turning sounds into vibrant
              conversations since 2015.
            </motion.p>

            {/* Mini audio visualizer */}
            <div className="flex items-end gap-0.5 h-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-[var(--color-accent)] rounded-full"
                  animate={{
                    height: [8, 20 + Math.random() * 12, 8],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  style={{ opacity: 0.5 }}
                />
              ))}
            </div>
          </div>

          {/* Services links */}
          <div>
            <motion.h4
              className="text-sm font-bold uppercase tracking-wider mb-4 text-[var(--color-text-muted)]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Services
            </motion.h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link, i) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <motion.h4
              className="text-sm font-bold uppercase tracking-wider mb-4 text-[var(--color-text-muted)]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Company
            </motion.h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, i) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5">
          <motion.p
            className="text-sm text-[var(--color-text-muted)] mb-4 md:mb-0"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            © {new Date().getFullYear()} VanVinkl. All rights reserved.
          </motion.p>

          <motion.div
            className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link
              href="#"
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              Privacy
            </Link>
            <span>•</span>
            <Link
              href="#"
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              Terms
            </Link>
            <span>•</span>
            <span>
              Made with{" "}
              <span className="text-[var(--color-accent)]">♪</span> by VanVinkl
            </span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
