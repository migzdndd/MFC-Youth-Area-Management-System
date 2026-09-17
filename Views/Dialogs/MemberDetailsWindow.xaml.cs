using System.Windows;using MFCYouthAreaManagementSystem.Repositories;
namespace MFCYouthAreaManagementSystem.Views.Dialogs;
public partial class MemberDetailsWindow:Window
{
 public MemberDetailsWindow(long memberId){InitializeComponent();var m=new MemberRepository().GetById(memberId)??throw new InvalidOperationException("Member not found.");NameText.Text=m.FullName;var age=DateTime.Today.Year-m.BirthDate.Year;if(m.BirthDate.Date>DateTime.Today.AddYears(-age))age--;MetaText.Text=$"{m.Status} • Age {age} • Born {m.BirthDate:MMM d, yyyy}";ContactText.Text=m.ContactNumber;EmailText.Text=string.IsNullOrWhiteSpace(m.EmailAddress)?"—":m.EmailAddress;AddressText.Text=m.Address;ChapterText.Text=string.IsNullOrWhiteSpace(m.ChapterName)?"Unassigned":m.ChapterName;ServicesText.Text=m.Services;var repo=new GIGContributionRepository();GigTotalText.Text=$"₱{repo.GetTotalForMember(memberId):N2}";GigGrid.ItemsSource=repo.GetByMember(memberId).Take(10).ToList();}
 private void Close_Click(object s,RoutedEventArgs e)=>Close();
}
