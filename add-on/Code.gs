// Copyright Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Reference: https://developers.google.com/apps-script/reference/base/mime-type
const ALLOWED_CONTENT_TYPES = [
  MimeType.PDF,
  MimeType.PLAIN_TEXT,
  MimeType.RTF,
  MimeType.MICROSOFT_WORD,
  MimeType.MICROSOFT_WORD_LEGACY,
  MimeType.ZIP,
];

const userProperties = PropertiesService.getUserProperties();

const onSettingsAction = (event) => {
  const properties = userProperties.getProperties();

  return CardService.newUniversalActionResponseBuilder()
    .displayAddOnCards([
      CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader().setTitle('Settings'))
        .addSection(
          CardService.newCardSection()
            .addWidget(
              CardService.newTextInput()
                .setFieldName('parentFolderId')
                .setTitle('Parent Folder ID')
                .setHint('Google Drive Parent Folder ID where documents will be saved')
                .setValue(properties['parentFolderId'] || ''),
            )
            .addWidget(
              CardService.newTextInput()
                .setFieldName('filtersJson')
                .setTitle('Filters JSON')
                .setHint('A JSON representation of the filters')
                .setValue(properties['filtersJson'] || ''),
            ),
        )
        .setFixedFooter(
          CardService.newFixedFooter().setPrimaryButton(
            CardService.newTextButton()
              .setText('Save')
              .setOnClickAction(CardService.newAction().setFunctionName('saveSettingsCallback')),
          ),
        )
        .build(),
    ])
    .build();
};

const saveSettingsCallback = (event) => {
  const parentFolderId = event.formInputs['parentFolderId'][0];
  const filtersJson = JSON.parse(event.formInputs['filtersJson']);

  userProperties.setProperties(
    {
      parentFolderId,
      filtersJson: JSON.stringify(filtersJson),
    },
    true,
  );
};

const onGmailMessageOpen = (event) => {
  let card = CardService.newCardBuilder();
  card.setName('Knowledge Base');
  card.setHeader(CardService.newCardHeader().setTitle('Attachments'));

  const parentFolderId = userProperties.getProperty('parentFolderId');

  if (!parentFolderId || parentFolderId.trim() === '') {
    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText(
          'Please set up the application and add a Parent Folder ID in the Settings panel.',
        ),
      ),
    );

    return [card.build()];
  }

  card.addCardAction(
    CardService.newCardAction()
      .setText('Open Drive folder...')
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(DriveApp.getFolderById(parentFolderId).getUrl())
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
          .setOnClose(CardService.OnClose.NOTHING),
      ),
  );

  GmailApp.setCurrentMessageAccessToken(event.messageMetadata.accessToken);
  const messageId = event.messageMetadata.messageId;
  const message = GmailApp.getMessageById(messageId);
  const attachments = message.getAttachments({
    includeInlineImages: false,
  });

  if (attachments.length < 1) {
    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText('No attachments found.'),
      ),
    );

    return [card.build()];
  }

  let section = CardService.newCardSection();

  const filtersJson = JSON.parse(userProperties.getProperty('filtersJson'));

  for (const [label, values] of Object.entries(filtersJson)) {
    let checkboxGroup = CardService.newSelectionInput().setTitle(label).setFieldName(label);

    values.forEach((value) => {
      checkboxGroup.addItem(value, value, false);
    });

    section.addWidget(checkboxGroup);
  }

  section.addWidget(
    CardService.newTextButton()
      .setText('Save')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction().setFunctionName('saveToDriveCallback')),
  );

  card.addSection(section);

  return [card.build()];
};

const saveToDriveCallback = (event) => {
  GmailApp.setCurrentMessageAccessToken(event.messageMetadata.accessToken);
  const messageId = event.messageMetadata.messageId;
  const message = GmailApp.getMessageById(messageId);
  const attachments = message.getAttachments({
    includeInlineImages: false,
  });

  const parentFolderId = userProperties.getProperty('parentFolderId');
  const filtersJson = JSON.parse(userProperties.getProperty('filtersJson'));

  attachments.forEach((attachment) => {
    const contentType = attachment.getContentType();

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return;
    }

    let file = DriveApp.getFolderById(parentFolderId).createFile(attachment.copyBlob());
    const filename = file.getName();
    let newFilenameArray = [filename];

    Object.keys(filtersJson).forEach((label) => {
      const selections = event.formInputs[label];

      if (!selections) {
        return;
      }

      let hashtags = [];

      hashtags.push('#' + label.toLowerCase().split(/[ ,]+/).join('_'));

      selections.forEach((selection) => {
        hashtags.push('#' + selection.toLowerCase().split(/[ ,]+/).join('_'));
      });

      newFilenameArray.push(hashtags.join(' '));
    });

    file.setName(newFilenameArray.join(' '));
  });

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Saved!'))
    .build();
};
