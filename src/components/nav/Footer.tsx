import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white/80 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <h3 className="text-white font-semibold mb-2">John Mitchell Preserve HOA</h3>
          <p className="text-sm leading-relaxed">
            The official website of the John Mitchell Preserve Homeowners Association.
          </p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-2 text-sm uppercase tracking-wide">Quick Links</h4>
          <ul className="space-y-1 text-sm">
            <li><Link href="/calendar" className="hover:text-white">Calendar</Link></li>
            <li><Link href="/about/faq" className="hover:text-white">FAQ</Link></li>
            <li><Link href="/members/documents" className="hover:text-white">HOA Documents</Link></li>
            <li><Link href="/members/dues" className="hover:text-white">Pay Association Fees</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-2 text-sm uppercase tracking-wide">Contact</h4>
          <ul className="space-y-1 text-sm">
            <li>Board: JMPHOAboard@gmail.com</li>
            <li>Architecture Committee: JMPHOArch@gmail.com</li>
            <li>Social Committee: JMPHOAsocial@gmail.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-xs py-4 text-white/60">
        © {new Date().getFullYear()} John Mitchell Preserve Homeowners Association. All rights reserved.
      </div>
    </footer>
  );
}
