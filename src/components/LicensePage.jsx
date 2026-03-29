export default function LicensePage({ onClose }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">License</h1>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 bg-white px-3 py-1.5 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 prose prose-sm max-w-none text-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mt-0">PolyForm Noncommercial License 1.0.0</h2>
          <a
            href="https://polyformproject.org/licenses/noncommercial/1.0.0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline text-sm break-all"
          >
            https://polyformproject.org/licenses/noncommercial/1.0.0
          </a>

          <section>
            <h3 className="font-semibold text-gray-900">Acceptance</h3>
            <p>In order to get any license under these terms, you must agree to them as both strict obligations and conditions to all your licenses.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Copyright License</h3>
            <p>The licensor grants you a copyright license for the software to do everything you might do with the software that would otherwise infringe the licensor's copyright in it for any permitted purpose. However, you may only distribute the software according to the Distribution License and make changes or new works based on the software according to the Changes and New Works License.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Distribution License</h3>
            <p>The licensor grants you an additional copyright license to distribute copies of the software. Your license to distribute covers distributing the software with changes and new works permitted by the Changes and New Works License.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Notices</h3>
            <p>You must ensure that anyone who gets a copy of any part of the software from you also gets a copy of these terms or the URL for them above, as well as copies of any plain-text lines beginning with <code className="bg-gray-100 px-1 rounded text-xs">Required Notice:</code> that the licensor provided with the software. For example:</p>
            <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-500 text-sm">Required Notice: Copyright Yoyodyne, Inc. (http://example.com)</blockquote>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Changes and New Works License</h3>
            <p>The licensor grants you an additional copyright license to make changes and new works based on the software for any permitted purpose.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Patent License</h3>
            <p>The licensor grants you a patent license for the software that covers patent claims the licensor can license, or becomes able to license, that you would infringe by using the software.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Noncommercial Purposes</h3>
            <p>Any noncommercial purpose is a permitted purpose.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Personal Uses</h3>
            <p>Personal use for research, experiment, and testing for the benefit of public knowledge, personal study, private entertainment, hobby projects, amateur pursuits, or religious observance, without any anticipated commercial application, is use for a permitted purpose.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Noncommercial Organizations</h3>
            <p>Use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization, or government institution is use for a permitted purpose regardless of the source of funding or obligations resulting from the funding.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Fair Use</h3>
            <p>You may have "fair use" rights for the software under the law. These terms do not limit them.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">No Other Rights</h3>
            <p>These terms do not allow you to sublicense or transfer any of your licenses to anyone else, or prevent the licensor from granting licenses to anyone else. These terms do not imply any other licenses.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Patent Defense</h3>
            <p>If you make any written claim that the software infringes or contributes to infringement of any patent, your patent license for the software granted under these terms ends immediately. If your company makes such a claim, your patent license ends immediately for work on behalf of your company.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Violations</h3>
            <p>The first time you are notified in writing that you have violated any of these terms, or done anything with the software not covered by your licenses, your licenses can nonetheless continue if you come into full compliance with these terms, and take practical steps to correct past violations, within 32 days of receiving notice. Otherwise, all your licenses end immediately.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">No Liability</h3>
            <p className="font-semibold">As far as the law allows, the software comes as is, without any warranty or condition, and the licensor will not be liable to you for any damages arising out of these terms or the use or nature of the software, under any kind of legal claim.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900">Definitions</h3>
            <p>The <strong>licensor</strong> is the individual or entity offering these terms, and the <strong>software</strong> is the software the licensor makes available under these terms.</p>
            <p><strong>You</strong> refers to the individual or entity agreeing to these terms.</p>
            <p><strong>Your company</strong> is any legal entity, sole proprietorship, or other kind of organization that you work for, plus all organizations that have control over, are under the control of, or are under common control with that organization. <strong>Control</strong> means ownership of substantially all the assets of an entity, or the power to direct its management and policies by vote, contract, or otherwise. Control can be direct or indirect.</p>
            <p><strong>Your licenses</strong> are all the licenses granted to you for the software under these terms.</p>
            <p><strong>Use</strong> means anything you do with the software requiring one of your licenses.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
