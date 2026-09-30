using System.Windows;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.Utilities;

namespace MFCYouthAreaManagementSystem.Views.Dialogs;

public partial class MemberEditorWindow : Window
{
    private readonly MemberRepository _repo = new();
    private readonly long? _memberId;
    public long SavedMemberId { get; private set; }

    public MemberEditorWindow(long? memberId = null)
    {
        InitializeComponent();
        _memberId = memberId;
        StatusCombo.ItemsSource = ApplicationConstants.MemberStatuses;
        StatusCombo.SelectedIndex = 0;
        var chapters = new List<Chapter> { new() { ChapterID = 0, ChapterName = "Unassigned" } };
        chapters.AddRange(new ChapterRepository().GetAll());
        ChapterCombo.ItemsSource = chapters;
        ChapterCombo.SelectedIndex = 0;
        BirthDatePicker.SelectedDate = DateTime.Today.AddYears(-16);
        if (memberId.HasValue) LoadMember(memberId.Value);
        Heading.Text = memberId.HasValue ? "Edit Member" : "Add Member";
        Title = Heading.Text;
    }

    private void LoadMember(long id)
    {
        var m = _repo.GetById(id) ?? throw new InvalidOperationException("Member was not found.");
        FirstNameBox.Text = m.FirstName; MiddleNameBox.Text = m.MiddleName ?? ""; LastNameBox.Text = m.LastName;
        BirthDatePicker.SelectedDate = m.BirthDate; ContactBox.Text = m.ContactNumber; EmailBox.Text = m.EmailAddress ?? "";
        AddressBox.Text = m.Address; StatusCombo.SelectedItem = m.Status;
        ChapterCombo.SelectedItem = ((IEnumerable<Chapter>)ChapterCombo.ItemsSource).FirstOrDefault(c => c.ChapterID == (m.ChapterID ?? 0));
    }

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var chapter = ChapterCombo.SelectedItem as Chapter;
            var member = new Member
            {
                MemberID = _memberId ?? 0, FirstName = FirstNameBox.Text.Trim(), MiddleName = string.IsNullOrWhiteSpace(MiddleNameBox.Text) ? null : MiddleNameBox.Text.Trim(),
                LastName = LastNameBox.Text.Trim(), BirthDate = BirthDatePicker.SelectedDate ?? default, ContactNumber = ContactBox.Text.Trim(),
                EmailAddress = string.IsNullOrWhiteSpace(EmailBox.Text) ? null : EmailBox.Text.Trim(), Address = AddressBox.Text.Trim(),
                Status = Convert.ToString(StatusCombo.SelectedItem) ?? "Active", ChapterID = chapter is null || chapter.ChapterID == 0 ? null : chapter.ChapterID
            };
            if (string.IsNullOrWhiteSpace(member.Address)) throw new InvalidOperationException("Address is required.");
            if (_memberId.HasValue) { _repo.Update(member); SavedMemberId = _memberId.Value; } else SavedMemberId = _repo.Add(member);
            DialogResult = true;
        }
        catch (Exception ex) { MessageBox.Show(this, ex.Message, "Unable to save member", MessageBoxButton.OK, MessageBoxImage.Warning); }
    }

    private void Cancel_Click(object sender, RoutedEventArgs e) => DialogResult = false;
}
