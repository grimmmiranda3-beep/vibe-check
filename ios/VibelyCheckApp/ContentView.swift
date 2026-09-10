import SwiftUI
import WebKit
import UIKit

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

            var items: [Any] = [text]
            if let sharedURL { items.append(sharedURL) }

            let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
            controller.title = title

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
