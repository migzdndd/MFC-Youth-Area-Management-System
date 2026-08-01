using System;
using System.Data.SQLite;
using System.Windows.Forms;
using MFC_Youth_Database.Utilities;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class ManageChapterForm : Form
    {
        public ManageChapterForm()
        {
            InitializeComponent();
        }

        private void LoadChapters(string search = "")
        {
            lvChapters.Items.Clear();

            using (var connection = DatabaseManager.GetConnection())
            {
                connection.Open();

                string query =
                @"SELECT
    c.ChapterID,
    c.ChapterName,
    COUNT(m.MemberID) AS MemberCount
FROM Chapter c
LEFT JOIN Member m
    ON c.ChapterID = m.ChapterID
WHERE c.ChapterName LIKE @Search
GROUP BY c.ChapterID, c.ChapterName
ORDER BY c.ChapterName;";
                using (var command = new SQLiteCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@Search", $"%{search}%");
                    using (SQLiteDataReader reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int chapterID = Convert.ToInt32(reader["ChapterID"]);
                            string chapterName = reader["ChapterName"].ToString();
                            int memberCount = Convert.ToInt32(reader["MemberCount"]);

                            ListViewItem item = new ListViewItem(chapterName);

                            item.SubItems.Add(memberCount.ToString());

                            item.Tag = chapterID;

                            lvChapters.Items.Add(item);
                        }
                        lblTotalChapters.Text = $"Total Chapters: {lvChapters.Items.Count}";
                    }
                }
            }
        }

        private void ManageChapterForm_Load(object sender, EventArgs e)
        {
            LoadChapters();
        }

        private void txtSearch_TextChanged(object sender, EventArgs e)
        {
            LoadChapters(txtSearch.Text.Trim());
        }

        private void btnAddChapter_Click(object sender, EventArgs e)
        {
            using (ChapterDialogForm dialog = new ChapterDialogForm())
            {
                if (dialog.ShowDialog(this) == DialogResult.OK)
                {
                    string chapterName = dialog.ChapterName;

                    try
                    {
                        using (var connection = DatabaseManager.GetConnection())
                        {
                            connection.Open();

                            string checkQuery =
                                "SELECT COUNT(*) FROM Chapter WHERE ChapterName = @ChapterName";

                            using (var command = new SQLiteCommand(checkQuery, connection))
                            {
                                command.Parameters.AddWithValue(
                                    "@ChapterName",
                                    chapterName);

                                int count = Convert.ToInt32(command.ExecuteScalar());

                                if (count > 0)
                                {
                                    MessageBox.Show(
                                        "A chapter with this name already exists.",
                                        "Duplicate Chapter",
                                        MessageBoxButtons.OK,
                                        MessageBoxIcon.Warning);

                                    return;
                                }
                            }
                            string insertQuery =
                                "INSERT INTO Chapter (ChapterName) VALUES (@ChapterName)";

                            using (var insertCommand = new SQLiteCommand(insertQuery, connection))
                            {
                                insertCommand.Parameters.AddWithValue(
                                    "@ChapterName",
                                    chapterName);

                                insertCommand.ExecuteNonQuery();
                            }
                        }
                        LoadChapters(txtSearch.Text.Trim());

                        MessageBox.Show(
                            "Chapter added successfully.",
                            "Success",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show(
                            ex.Message,
                            ApplicationConstants.DatabaseErrorTitle,
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error);
                    }
                }
            }
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (lvChapters.SelectedItems.Count == 0)
            {
                MessageBox.Show(
                    "Please select a chapter to delete.",
                    "No Selection",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                return;
            }

            ListViewItem selectedItem = lvChapters.SelectedItems[0];

            int chapterID = Convert.ToInt32(selectedItem.Tag);

            string chapterName = selectedItem.Text;
            DialogResult result = MessageBox.Show(
                $"Are you sure you want to delete '{chapterName}'?",
                "Confirm Delete",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (result == DialogResult.No)
            {
                return;
            }

            try
            {
                using (var connection = DatabaseManager.GetConnection())
                {
                    connection.Open();
                    string checkMembersQuery =
                        "SELECT COUNT(*) FROM Member WHERE ChapterID = @ChapterID";
                    using (var command = new SQLiteCommand(checkMembersQuery, connection))
                    {
                        command.Parameters.AddWithValue(
                            "@ChapterID",
                            chapterID);
                        int memberCount = Convert.ToInt32(command.ExecuteScalar());

                        if (memberCount > 0)
                        {
                            MessageBox.Show(
                                "This chapter cannot be deleted because it still has assigned members.",
                                "Delete Not Allowed",
                                MessageBoxButtons.OK,
                                MessageBoxIcon.Warning);

                            return;
                        }
                        string deleteQuery =
                            "DELETE FROM Chapter WHERE ChapterID = @ChapterID";
                        using (var deleteCommand = new SQLiteCommand(deleteQuery, connection))
                        {
                            deleteCommand.Parameters.AddWithValue(
                                "@ChapterID",
                                chapterID);

                            deleteCommand.ExecuteNonQuery();
                        }
                    }
                }

                LoadChapters(txtSearch.Text.Trim());

                MessageBox.Show(
                    "Chapter deleted successfully.",
                    "Success",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    ApplicationConstants.DatabaseErrorTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
    }
}
