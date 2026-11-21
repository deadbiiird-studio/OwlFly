# OwlFly on iPhone

GitHub builds OwlFly on a hosted Mac. You can set up signing from the Chromebook. A compatible physical iPhone is needed to test touch, sound, interruptions and offline play. The iPhone app uses the bundled game, portrait orientation, iOS 15 or later, bundle ID `com.owlfly.game` and marketing version `1.0`. The current TestFlight app requires iOS 16 or later.

## 1. Activate your Apple account

The project’s recorded enrollment choice is **Individual / sole proprietor**. Apple displays your legal name as the seller. Sign in with your permanent Apple Account, turn on two-factor authentication, complete Apple’s identity check and accept the agreements. The US Apple Developer Program fee is $99 per membership year. If your membership is already active, go directly to the app record. [Enrollment](https://developer.apple.com/programs/enroll/) · [Apple's enrollment help](https://developer.apple.com/help/account/membership/program-enrollment/)

## 2. Reserve the iPhone app record

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list), choose **Identifiers → + → App IDs → App → Explicit**. Enter `OwlFly` and `com.owlfly.game`. If Apple reports it belongs to another team, stop before generating credentials and resolve the iOS identifier with the project maintainer.
2. In [App Store Connect](https://appstoreconnect.apple.com/apps), choose **Apps → + → New App**. Select **iOS**, **OwlFly**, **English (U.S.)**, the registered bundle ID and SKU `OWLFLY-IOS-001`. Accept any pending Business agreement if Apple asks. [App record instructions](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)

## 3. Make the signing certificate and provisioning profile

Use your own Chromebook Linux terminal. If you already have a valid Apple Distribution certificate with its private key exported as a password-protected .p12, use that .p12 and skip the certificate creation commands. Keep signing materials in your private Linux files, outside the repository.

```bash
mkdir -p -m 700 "$HOME/owlfly-apple" && cd "$HOME/owlfly-apple" && (
  set -eu
  umask 077
  if [ -e distribution.key ] || [ -e OwlFly.certSigningRequest ]; then
    echo 'Existing key or request found. Reuse the matching pair.'
    exit 1
  fi
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -aes-256-cbc -out distribution.key
  openssl req -new -key distribution.key -out OwlFly.certSigningRequest
)
```

Save the private-key passphrase. At the CSR prompts enter your legal name and email and leave the optional challenge password blank. In Apple Developer **Certificates → + → Apple Distribution**, upload **only** `OwlFly.certSigningRequest` from **Files → Linux files → owlfly-apple**. Download Apple's certificate to that folder as `distribution.cer`. Convert it to a .p12 and choose a nonempty export password when prompted.

```bash
cd "$HOME/owlfly-apple" && (
  set -eu
  umask 077
  test ! -e distribution.p12
  openssl x509 -inform DER -in distribution.cer -out distribution.pem
  openssl pkcs12 -export -inkey distribution.key -in distribution.pem -name 'OwlFly Apple Distribution' \
    -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1 -out distribution.p12
)
```

In Apple Developer **Profiles → + → Distribution → App Store Connect**, choose the OwlFly App ID and that same distribution certificate. Generate the profile and save it as `OwlFly.mobileprovision` in the same folder. Keep a private backup of the key, .p12 and passphrases. [Provisioning profile instructions](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile/)

## 4. Give the GitHub release job its six secrets

In App Store Connect **Users and Access → Integrations → App Store Connect API**, request API access as Account Holder if prompted. Under **Team Keys**, generate a key with the **Developer** role for uploads. Save its **Key ID**, **Issuer ID** and the downloaded `AuthKey_<KeyID>.p8` in your private folder. Apple permits one private-key download. [Apple's API key instructions](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/)

Open [GitHub environment settings](https://github.com/deadbiiird-studio/OwlFly/settings/environments), open or create **ios-testflight**, and under **Deployment branches and tags** select **Selected branches and tags** and add the branch **main**. Add the six values under **Environment secrets**. The .p12 and profile take single-line base64, the password is the .p12 export password and the .p8 takes its full original text. Enter keys directly into GitHub.

| Secret | Value |
| --- | --- |
| `IOS_P12_BASE64` | Base64 of `distribution.p12` |
| `IOS_P12_PASSWORD` | The .p12 export password |
| `IOS_PROFILE_BASE64` | Base64 of `OwlFly.mobileprovision` |
| `ASC_KEY_ID` | Team API key ID |
| `ASC_ISSUER_ID` | Team issuer ID |
| `ASC_PRIVATE_KEY` | Full contents of `AuthKey_<KeyID>.p8`, including both boundary lines |

If GitHub CLI is installed, this block sets the same secrets directly from the files. It prompts for the .p12 export password privately.

```bash
cd "$HOME/owlfly-apple" && (
  set -eu
  gh auth status --hostname github.com >/dev/null 2>&1 || gh auth login --hostname github.com --web
  read -rp 'Apple team API key ID: ' key_id
  read -rp 'Apple issuer ID: ' issuer_id
  p8="AuthKey_${key_id}.p8"
  test -s "$p8" && test -s distribution.p12 && test -s OwlFly.mobileprovision || exit 1
  secret=(gh secret set --repo deadbiiird-studio/OwlFly --env ios-testflight)
  base64 -w0 distribution.p12 | "${secret[@]}" IOS_P12_BASE64
  "${secret[@]}" IOS_P12_PASSWORD
  base64 -w0 OwlFly.mobileprovision | "${secret[@]}" IOS_PROFILE_BASE64
  printf %s "$key_id" | "${secret[@]}" ASC_KEY_ID
  printf %s "$issuer_id" | "${secret[@]}" ASC_ISSUER_ID
  "${secret[@]}" ASC_PRIVATE_KEY < "$p8"
)
```

For browser entry, run `base64 -w0 distribution.p12 | wl-copy` and `base64 -w0 OwlFly.mobileprovision | wl-copy` individually if your Linux terminal has wl-copy. Paste each into its matching secret. For an alternative with a local text editor, create a private text file with `(umask 077; base64 -w0 distribution.p12 > distribution.p12.b64)` and do the same for the profile. Treat these copies as private keys.

## 5. Upload and install the first beta

1. Open [OwlFly iOS and TestFlight](https://github.com/deadbiiird-studio/OwlFly/actions/workflows/ios-preflight.yml), select **Run workflow → main**, check **Sign and upload this build to App Store Connect for TestFlight**, then run. A routine push or pull request checks the simulator and device archive. Signing runs only on an explicit upload from main.
2. Check that **Sign, verify and upload to TestFlight** finishes successfully. The job signs the app on a temporary keychain, checks the exported IPA and sends it to Apple. The run summary shows the iOS build number. Fresh dispatches get increasing numbers within this workflow. If retrying after a later build reached Apple, start a new run.
3. In App Store Connect **Apps → OwlFly → TestFlight**, wait for processing, answer any export-compliance prompt using the app’s actual features, and add the processed build and your own App Store Connect account to an **Internal Testing** group. A friend outside your App Store Connect team goes in an **External Testing** group. Complete beta details and submit the first external build for TestFlight App Review. [Testing instructions](https://developer.apple.com/testflight/)
4. On the iPhone, install [TestFlight](https://apps.apple.com/us/app/testflight/id899247664), open the invitation on that phone and tap **Accept → Install → Open**. Record the displayed version/build and device model.

## 6. Run the physical play check

| On the iPhone | Pass condition |
| --- | --- |
| Open OwlFly, tap Start Flight, crash, then restart twice | The menu and playfield fit around the notch and home indicator. Each start and restart gives the countdown and audible cue with sound enabled. The owl survives until control begins. |
| Tap, then hold and release | A tap flaps once. Holding repeats the flap. Releasing stops it. Compare the wings with Motion set to Full and Low. |
| Lock/unlock, switch apps, and resume | Controls recover, sound resumes when enabled, and a held touch does not stay stuck. |
| Finish a run, enable Airplane Mode, fully close and reopen | The game starts offline with its owl, roofs and audio. The recorded best score and settings survive. |

A screenshot or short recording with the build number makes a failed check reproducible. For public App Store distribution, the account holder also completes the store listing, actual iPhone screenshots, privacy disclosures, age rating, review contact and submission in App Store Connect. TestFlight upload does not submit the public listing.
