import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import 'forgot_password_dialog.dart';
import 'member_claim_dialog.dart';
import 'register_dialog.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _mfaCodeController = TextEditingController();
  bool _showPassword = false;
  bool _rememberMe = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _mfaCodeController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please provide your email and password.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final auth = context.read<AuthProvider>();
    final ok = await auth.login(email, password, remember: _rememberMe);

    if (mounted) {
      setState(() {
        _loading = false;
        if (!ok && !auth.mfaRequired) {
          _error = auth.authError ?? 'Invalid credentials or inactive servant account.';
        }
      });
    }
  }

  Future<void> _handleMfaVerify() async {
    final code = _mfaCodeController.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Please enter a valid 6-digit verification code.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final auth = context.read<AuthProvider>();
    final ok = await auth.verifyMfaTotp(code, remember: _rememberMe);

    if (mounted) {
      setState(() {
        _loading = false;
        if (!ok) {
          _error = auth.authError ?? 'Invalid authentication code. Please try again.';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();
    final auth = context.watch<AuthProvider>();
    final isDark = theme.isDark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.navyDark : AppColors.pageLight,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top right theme toggle
                  Align(
                    alignment: Alignment.topRight,
                    child: IconButton(
                      icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode, size: 22),
                      onPressed: () => theme.toggleTheme(),
                      tooltip: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
                    ),
                  ),

                  // Brand Header
                  Center(
                    child: Image.asset(
                      'assets/images/logo-2.png',
                      height: 72,
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 14),

                  Text(
                    'MFC Youth',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: isDark ? AppColors.textLight : AppColors.navy,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Login or MFA Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: auth.mfaRequired ? _buildMfaView(isDark) : _buildLoginView(isDark),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginView(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Sign in to your Area',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: isDark ? AppColors.textLight : AppColors.textDark,
          ),
        ),
        const SizedBox(height: 16),

        // Error Banner
        if (_error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerBg,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _error!,
                    style: const TextStyle(fontSize: 12, color: AppColors.danger),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Email Field
        const Text('Email Address', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          enabled: !_loading,
          decoration: InputDecoration(
            hintText: 'you@mfcyouth.org',
            prefixIcon: const Icon(Icons.email_outlined, size: 18),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        const SizedBox(height: 16),

        // Password Field
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            GestureDetector(
              onTap: () {
                showDialog(
                  context: context,
                  builder: (ctx) => const ForgotPasswordDialog(),
                );
              },
              child: const Text(
                'Forgot Your Password?',
                style: TextStyle(fontSize: 12, color: AppColors.blue, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _passwordController,
          obscureText: !_showPassword,
          enabled: !_loading,
          onSubmitted: (_) => _handleLogin(),
          decoration: InputDecoration(
            hintText: 'Enter your password',
            prefixIcon: const Icon(Icons.lock_outline, size: 18),
            suffixIcon: IconButton(
              icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility, size: 18),
              onPressed: () => setState(() => _showPassword = !_showPassword),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        const SizedBox(height: 14),

        // Remember Me
        Row(
          children: [
            SizedBox(
              height: 24,
              width: 24,
              child: Checkbox(
                value: _rememberMe,
                onChanged: _loading ? null : (v) => setState(() => _rememberMe = v ?? true),
                activeColor: AppColors.blue,
              ),
            ),
            const SizedBox(width: 8),
            const Text('Remember this device', style: TextStyle(fontSize: 13)),
          ],
        ),
        const SizedBox(height: 18),

        // Sign In Button
        SizedBox(
          height: 46,
          child: ElevatedButton(
            onPressed: _loading ? null : _handleLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.navy,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: _loading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text('Sign In', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          ),
        ),
        const SizedBox(height: 20),

        // Registration & Claim Buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => const RegisterDialog(),
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Register Admin Account', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700), textAlign: TextAlign.center),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => const MemberClaimDialog(),
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Claim Member Account', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700), textAlign: TextAlign.center),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMfaView(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Two-Factor Verification',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textLight : AppColors.textDark,
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => context.read<AuthProvider>().cancelMfa(),
            ),
          ],
        ),
        const SizedBox(height: 16),

        if (_error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerBg,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
            ),
            child: Text(
              _error!,
              style: const TextStyle(fontSize: 12, color: AppColors.danger),
            ),
          ),
          const SizedBox(height: 16),
        ],

        TextField(
          controller: _mfaCodeController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: 6),
          onSubmitted: (_) => _handleMfaVerify(),
          decoration: InputDecoration(
            hintText: '000000',
            counterText: '',
            prefixIcon: const Icon(Icons.security, size: 20),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        const SizedBox(height: 20),

        SizedBox(
          height: 46,
          child: ElevatedButton(
            onPressed: _loading ? null : _handleMfaVerify,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blue,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: _loading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text('Verify Code', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          ),
        ),
        const SizedBox(height: 12),

        TextButton(
          onPressed: () => context.read<AuthProvider>().cancelMfa(),
          child: const Text('Back to Sign In'),
        ),
      ],
    );
  }
}
