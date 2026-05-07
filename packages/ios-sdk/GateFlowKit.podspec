Pod::Spec.new do |s|
  s.name           = 'GateFlowKit'
  s.version        = '0.1.0'
  s.summary        = 'GateFlow A/B Experimentation SDK for iOS'
  s.description    = 'Native iOS SDK for GateFlow A/B experimentation platform'
  s.license        = { :type => 'MIT' }
  s.author         = { 'GateFlow' => '' }
  s.homepage       = 'https://github.com/gate-flow/gate-flow'
  s.platforms      = { :ios => '15.0', :macos => '12.0' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/gate-flow/gate-flow', :tag => s.version.to_s }

  s.source_files = 'Sources/GateFlowKit/**/*.{swift}'
end
