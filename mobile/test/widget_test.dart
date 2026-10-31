import 'package:flutter_test/flutter_test.dart';
import 'package:kilani_hr_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const KilaniHRApp());
    expect(find.text('GROUPE KILANI'), findsOneWidget);
  });
}
