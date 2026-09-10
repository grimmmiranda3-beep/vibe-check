import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        VibelyWebView(url: URL(string: "https://vibelycheck.com")!)
            .ignoresSafeArea(.container, edges: .bottom)
    }
}

struct VibelyWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.load(URLRequest(url: url, cachePolicy: .reloadRevalidatingCacheData))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
