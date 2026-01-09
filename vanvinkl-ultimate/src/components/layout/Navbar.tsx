"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagneticButton } from "@/components/ui/MagneticButton";
import Link from "next/link";

const navItems = [
  { name: "Home", href: "#home" },
  { name: "Projects", href: "#projects" },
  { name: "About", href: "#about" },
  { name: "Services", href: "#services" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "py-4" : "py-6"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <MagneticButton href="#home" className="relative">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <span className="text-2xl font-bold">VanVinkl</span>
                <motion.div
                  className="absolute -bottom-1 left-0 h-[2px] bg-[var(--color-accent)]"
                  initial={{ width: 0 }}
                  animate={{ width: isScrolled ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          </MagneticButton>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <MagneticButton
                key={item.name}
                href={item.href}
                className="relative group"
                strength={0.2}
              >
                <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                  {item.name}
                </span>
                <motion.div
                  className="absolute -bottom-1 left-0 h-[1px] bg-[var(--color-accent)]"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </MagneticButton>
            ))}

            {/* CTA Button */}
            <MagneticButton href="#contact" className="btn btn-primary" strength={0.3}>
              Let&apos;s Talk
            </MagneticButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative w-10 h-10 flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="relative w-6 h-4">
              <motion.span
                className="absolute left-0 w-full h-[2px] bg-white"
                animate={{
                  top: isMobileMenuOpen ? "50%" : "0%",
                  rotate: isMobileMenuOpen ? 45 : 0,
                  translateY: isMobileMenuOpen ? "-50%" : 0,
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="absolute left-0 top-1/2 w-full h-[2px] bg-white"
                animate={{
                  opacity: isMobileMenuOpen ? 0 : 1,
                  translateY: "-50%",
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="absolute left-0 w-full h-[2px] bg-white"
                animate={{
                  bottom: isMobileMenuOpen ? "50%" : "0%",
                  rotate: isMobileMenuOpen ? -45 : 0,
                  translateY: isMobileMenuOpen ? "50%" : 0,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-[var(--color-bg-deepest)] flex items-center justify-center md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex flex-col items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {navItems.map((item, i) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-4xl font-bold"
                  onClick={() => setIsMobileMenuOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                  whileHover={{ scale: 1.1, color: "var(--color-accent)" }}
                >
                  {item.name}
                </motion.a>
              ))}

              <motion.a
                href="#contact"
                className="btn btn-primary mt-4"
                onClick={() => setIsMobileMenuOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Let&apos;s Talk
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
