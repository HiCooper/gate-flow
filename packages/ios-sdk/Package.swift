// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "GateFlowSDK",
    platforms: [
        .iOS(.v15),
        .macOS(.v12),
    ],
    products: [
        .library(name: "GateFlowKit", targets: ["GateFlowKit"]),
        .executable(name: "SDKTest", targets: ["SDKTest"]),
    ],
    targets: [
        .target(
            name: "GateFlowKit",
            path: "Sources/GateFlowKit"
        ),
        .testTarget(
            name: "GateFlowKitTests",
            dependencies: ["GateFlowKit"],
            path: "Tests/GateFlowKitTests"
        ),
        .executableTarget(
            name: "SDKTest",
            dependencies: [],
            path: "Tests/StandaloneTest"
        ),
    ]
)
