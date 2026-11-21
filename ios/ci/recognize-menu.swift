import Foundation
import Vision

let screenshot = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["en-US"]
try VNImageRequestHandler(url: screenshot).perform([request])
let text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
let menuVisible = text.joined(separator: " ").localizedCaseInsensitiveContains("Start Flight")
exit(menuVisible ? 0 : 1)
