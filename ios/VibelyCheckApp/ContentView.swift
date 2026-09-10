import SwiftUI
import WebKit
import UIKit
import LinkPresentation

struct ContentView: View {
    var body: some View {
        VibelyWebView(url: URL(string: "https://vibelycheck.com")!)
            .ignoresSafeArea(.container, edges: .bottom)
    }
}

struct VibelyWebView: UIViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.userContentController.add(context.coordinator, name: "shareVibe")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.webView = webView
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.load(URLRequest(url: url, cachePolicy: .reloadRevalidatingCacheData))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler {
        weak var webView: WKWebView?

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "shareVibe",
                  let payload = message.body as? [String: Any] else { return }

            let title = payload["title"] as? String ?? "Vibe Check"
            let text = payload["text"] as? String ?? "Check out this vibe on Vibe Check."
            let urlString = payload["url"] as? String
            let sharedURL = urlString.flatMap(URL.init(string:))

            // Give iOS a real share item with branded link metadata so the
            // preview feels like Vibe Check rather than a generic web link.
            let shareItem = VibeShareItem(
                title: title,
                text: text,
                url: sharedURL
            )

            let controller = UIActivityViewController(
                activityItems: [shareItem],
                applicationActivities: nil
            )
            controller.title = "Share Vibe"

            if let popover = controller.popoverPresentationController {
                popover.sourceView = webView
                popover.sourceRect = CGRect(
                    x: webView.bounds.midX,
                    y: webView.bounds.midY,
                    width: 1,
                    height: 1
                )
                popover.permittedArrowDirections = []
            }

            guard let presenter = topViewController(from: webView) else { return }
            presenter.present(controller, animated: true)
        }

        private func topViewController(from view: UIView) -> UIViewController? {
            var controller = view.window?.rootViewController
            while let presented = controller?.presentedViewController {
                controller = presented
            }
            return controller
        }
    }
}

/// Custom share item used by the native iOS share sheet.
/// It keeps the actual message useful while supplying link metadata for a
/// polished Vibe Check preview in Messages and other supported share targets.
final class VibeShareItem: NSObject, UIActivityItemSource {
    let title: String
    let text: String
    let url: URL?

    init(title: String, text: String, url: URL?) {
        self.title = title
        self.text = text
        self.url = url
    }

    func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController) -> Any {
        url ?? text
    }

    func activityViewController(
        _ activityViewController: UIActivityViewController,
        itemForActivityType activityType: UIActivity.ActivityType?
    ) -> Any? {
        if let url {
            return "\(text)\n\n\(url.absoluteString)"
        }
        return text
    }

    func activityViewControllerLinkMetadata(
        _ activityViewController: UIActivityViewController
    ) -> LPLinkMetadata? {
        guard let url else { return nil }

        let metadata = LPLinkMetadata()
        metadata.title = title
        metadata.originalURL = url
        metadata.url = url
        return metadata
    }
}
